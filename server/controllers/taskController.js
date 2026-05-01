const { validationResult } = require('express-validator');
const Task = require('../models/Task');
const Project = require('../models/Project');

exports.createTask = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }
    const { title, description, project, assignedTo, status, priority, dueDate } = req.body;
    const projectDoc = await Project.findById(project);
    if (!projectDoc) return res.status(404).json({ success: false, message: 'Project not found.' });

    const membership = projectDoc.members.find(m => m.user.toString() === req.user.id);
    if (!membership) return res.status(403).json({ success: false, message: 'Not a member.' });
    if (membership.role !== 'Admin') return res.status(403).json({ success: false, message: 'Only admins can create tasks.' });

    if (assignedTo) {
      const assigneeMember = projectDoc.members.find(m => m.user.toString() === assignedTo);
      if (!assigneeMember) return res.status(400).json({ success: false, message: 'Assigned user is not a project member.' });
    }

    const task = await Task.create({
      title, description: description || '', project,
      assignedTo: assignedTo || null, createdBy: req.user.id,
      status: status || 'To Do', priority: priority || 'Medium',
      dueDate: dueDate || null,
    });
    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');
    res.status(201).json({ success: true, message: 'Task created.', data: { task } });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ success: false, message: 'Server error creating task.' });
  }
};

exports.getTasks = async (req, res) => {
  try {
    const { project, status, priority, assignedTo } = req.query;
    if (!project) return res.status(400).json({ success: false, message: 'Project ID required.' });

    const projectDoc = await Project.findById(project);
    if (!projectDoc) return res.status(404).json({ success: false, message: 'Project not found.' });

    const membership = projectDoc.members.find(m => m.user.toString() === req.user.id);
    if (!membership) return res.status(403).json({ success: false, message: 'Not a member.' });

    const query = { project };
    if (membership.role === 'Member') query.assignedTo = req.user.id;
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignedTo && membership.role === 'Admin') query.assignedTo = assignedTo;

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: { tasks, userRole: membership.role } });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching tasks.' });
  }
};

exports.getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('project', 'name');
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    const project = await Project.findById(task.project._id || task.project);
    const membership = project.members.find(m => m.user.toString() === req.user.id);
    if (!membership) return res.status(403).json({ success: false, message: 'Not a member.' });

    if (membership.role === 'Member' && task.assignedTo && task.assignedTo._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Can only view assigned tasks.' });
    }
    res.status(200).json({ success: true, data: { task, userRole: membership.role } });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    const project = await Project.findById(task.project);
    const membership = project.members.find(m => m.user.toString() === req.user.id);
    if (!membership) return res.status(403).json({ success: false, message: 'Not a member.' });

    if (membership.role === 'Member') {
      if (!task.assignedTo || task.assignedTo.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Can only update assigned tasks.' });
      }
      const allowed = ['status'];
      if (!Object.keys(req.body).every(k => allowed.includes(k))) {
        return res.status(403).json({ success: false, message: 'Members can only update status.' });
      }
    }

    if (req.body.assignedTo) {
      const am = project.members.find(m => m.user.toString() === req.body.assignedTo);
      if (!am) return res.status(400).json({ success: false, message: 'Assignee not a member.' });
    }

    ['title','description','assignedTo','status','priority','dueDate'].forEach(f => {
      if (req.body[f] !== undefined) task[f] = req.body[f];
    });
    await task.save();
    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');
    res.status(200).json({ success: true, message: 'Task updated.', data: { task } });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ success: false, message: 'Server error updating task.' });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    const project = await Project.findById(task.project);
    const membership = project.members.find(m => m.user.toString() === req.user.id);
    if (!membership || membership.role !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Only admins can delete tasks.' });
    }
    await Task.findByIdAndDelete(task._id);
    res.status(200).json({ success: true, message: 'Task deleted.' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting task.' });
  }
};
