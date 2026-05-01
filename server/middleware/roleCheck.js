const Project = require('../models/Project');

/**
 * Middleware factory to check if a user has a specific role within a project.
 * Must be used AFTER auth middleware.
 * Expects project ID in req.params.id or req.params.projectId or req.body.project
 */
const requireRole = (...roles) => {
  return async (req, res, next) => {
    try {
      const projectId =
        req.params.id || req.params.projectId || req.body.project;

      if (!projectId) {
        return res.status(400).json({
          success: false,
          message: 'Project ID is required.',
        });
      }

      const project = await Project.findById(projectId);

      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found.',
        });
      }

      // Find user's membership in this project
      const membership = project.members.find(
        (m) => m.user.toString() === req.user.id
      );

      if (!membership) {
        return res.status(403).json({
          success: false,
          message: 'You are not a member of this project.',
        });
      }

      if (roles.length > 0 && !roles.includes(membership.role)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required role: ${roles.join(' or ')}.`,
        });
      }

      // Attach project and role to request for downstream use
      req.project = project;
      req.userRole = membership.role;

      next();
    } catch (error) {
      console.error('Role check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Authorization error.',
      });
    }
  };
};

/**
 * Middleware to check project membership (any role)
 */
const requireMember = requireRole();

module.exports = { requireRole, requireMember };
