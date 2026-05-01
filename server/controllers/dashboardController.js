const Task = require('../models/Task');
const Project = require('../models/Project');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
exports.getStats = async (req, res) => {
  try {
    // Get all projects where user is a member
    const projects = await Project.find({ 'members.user': req.user.id });
    const projectIds = projects.map(p => p._id);

    if (projectIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          totalTasks: 0,
          byStatus: { 'To Do': 0, 'In Progress': 0, 'Done': 0 },
          overdueTasks: [],
          tasksByUser: [],
          recentTasks: [],
          projectCount: 0,
        },
      });
    }

    // Total tasks across user's projects
    const totalTasks = await Task.countDocuments({ project: { $in: projectIds } });

    // Tasks by status
    const statusAgg = await Task.aggregate([
      { $match: { project: { $in: projectIds } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const byStatus = { 'To Do': 0, 'In Progress': 0, 'Done': 0 };
    statusAgg.forEach(s => { byStatus[s._id] = s.count; });

    // Tasks by user
    const tasksByUser = await Task.aggregate([
      { $match: { project: { $in: projectIds }, assignedTo: { $ne: null } } },
      { $group: { _id: '$assignedTo', count: { $sum: 1 } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { _id: 0, userId: '$_id', name: '$user.name', email: '$user.email', count: 1 } },
      { $sort: { count: -1 } },
    ]);

    // Overdue tasks
    const overdueTasks = await Task.find({
      project: { $in: projectIds },
      dueDate: { $lt: new Date() },
      status: { $ne: 'Done' },
    })
      .populate('assignedTo', 'name email')
      .populate('project', 'name')
      .sort({ dueDate: 1 })
      .limit(10);

    // Recent tasks
    const recentTasks = await Task.find({ project: { $in: projectIds } })
      .populate('assignedTo', 'name email')
      .populate('project', 'name')
      .sort({ updatedAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        totalTasks,
        byStatus,
        overdueTasks,
        tasksByUser,
        recentTasks,
        projectCount: projects.length,
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching stats.' });
  }
};
