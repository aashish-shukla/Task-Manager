const { validationResult } = require('express-validator');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private
exports.createProject = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
        errors: errors.array(),
      });
    }

    const { name, description } = req.body;

    const project = await Project.create({
      name,
      description: description || '',
      owner: req.user.id,
      members: [{ user: req.user.id, role: 'Admin' }],
    });

    // Populate members for response
    await project.populate('members.user', 'name email');

    res.status(201).json({
      success: true,
      message: 'Project created successfully.',
      data: { project },
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating project.',
    });
  }
};

// @desc    Get all projects for current user
// @route   GET /api/projects
// @access  Private
exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      'members.user': req.user.id,
    })
      .populate('members.user', 'name email')
      .sort({ updatedAt: -1 });

    // Get task counts for each project
    const projectsWithCounts = await Promise.all(
      projects.map(async (project) => {
        const taskCount = await Task.countDocuments({ project: project._id });
        const completedCount = await Task.countDocuments({
          project: project._id,
          status: 'Done',
        });
        const projectObj = project.toObject();
        projectObj.taskCount = taskCount;
        projectObj.completedCount = completedCount;
        return projectObj;
      })
    );

    res.status(200).json({
      success: true,
      data: { projects: projectsWithCounts },
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching projects.',
    });
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private (member only)
exports.getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate(
      'members.user',
      'name email'
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
      });
    }

    // Check if user is a member
    const isMember = project.members.some(
      (m) => m.user._id.toString() === req.user.id
    );
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this project.',
      });
    }

    // Get user's role
    const membership = project.members.find(
      (m) => m.user._id.toString() === req.user.id
    );

    const taskCount = await Task.countDocuments({ project: project._id });
    const projectObj = project.toObject();
    projectObj.taskCount = taskCount;
    projectObj.userRole = membership.role;

    res.status(200).json({
      success: true,
      data: { project: projectObj },
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching project.',
    });
  }
};

// @desc    Add member to project
// @route   POST /api/projects/:id/members
// @access  Private (Admin only)
exports.addMember = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
        errors: errors.array(),
      });
    }

    const { email, role } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
      });
    }

    // Check if requester is Admin
    const requesterMembership = project.members.find(
      (m) => m.user.toString() === req.user.id
    );
    if (!requesterMembership || requesterMembership.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can add members.',
      });
    }

    // Find user by email
    const userToAdd = await User.findOne({ email: email.toLowerCase() });
    if (!userToAdd) {
      return res.status(404).json({
        success: false,
        message: 'No user found with this email. They must sign up first.',
      });
    }

    // Check if already a member
    const alreadyMember = project.members.some(
      (m) => m.user.toString() === userToAdd._id.toString()
    );
    if (alreadyMember) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member of this project.',
      });
    }

    // Add member
    project.members.push({
      user: userToAdd._id,
      role: role || 'Member',
    });

    await project.save();
    await project.populate('members.user', 'name email');

    res.status(200).json({
      success: true,
      message: `${userToAdd.name} added to the project.`,
      data: { project },
    });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding member.',
    });
  }
};

// @desc    Remove member from project
// @route   DELETE /api/projects/:id/members/:userId
// @access  Private (Admin only)
exports.removeMember = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
      });
    }

    // Check if requester is Admin
    const requesterMembership = project.members.find(
      (m) => m.user.toString() === req.user.id
    );
    if (!requesterMembership || requesterMembership.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can remove members.',
      });
    }

    // Can't remove yourself if you're the only admin
    if (req.params.userId === req.user.id) {
      const adminCount = project.members.filter(
        (m) => m.role === 'Admin'
      ).length;
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot remove the only admin. Transfer ownership first.',
        });
      }
    }

    // Check if user is a member
    const memberIndex = project.members.findIndex(
      (m) => m.user.toString() === req.params.userId
    );
    if (memberIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'User is not a member of this project.',
      });
    }

    // Remove member
    project.members.splice(memberIndex, 1);
    await project.save();

    // Unassign tasks from removed user in this project
    await Task.updateMany(
      { project: project._id, assignedTo: req.params.userId },
      { $set: { assignedTo: null } }
    );

    await project.populate('members.user', 'name email');

    res.status(200).json({
      success: true,
      message: 'Member removed from project.',
      data: { project },
    });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error removing member.',
    });
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (Admin only)
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
      });
    }

    // Check if requester is Admin
    const requesterMembership = project.members.find(
      (m) => m.user.toString() === req.user.id
    );
    if (!requesterMembership || requesterMembership.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can delete projects.',
      });
    }

    // Delete all tasks in this project
    await Task.deleteMany({ project: project._id });

    // Delete project
    await Project.findByIdAndDelete(project._id);

    res.status(200).json({
      success: true,
      message: 'Project and all its tasks deleted.',
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting project.',
    });
  }
};
