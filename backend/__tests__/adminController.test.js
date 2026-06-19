import { jest, describe, it, expect, beforeEach } from '@jest/globals';

const mockUserSave = jest.fn();
const mockUserFindById = jest.fn();
const mockUserFindOne = jest.fn();
const mockUserFind = jest.fn();
const mockUserCountDocuments = jest.fn();
const mockUserFindByIdAndDelete = jest.fn();
const mockUserFindByIdAndUpdate = jest.fn();
const mockUserUpdateMany = jest.fn();

jest.unstable_mockModule('../src/models/User.js', () => {
  const UserConstructor = jest.fn().mockImplementation(function (data) {
    Object.assign(this, data);
    this.save = mockUserSave;
  });
  UserConstructor.findById = mockUserFindById;
  UserConstructor.findOne = mockUserFindOne;
  UserConstructor.find = mockUserFind;
  UserConstructor.countDocuments = mockUserCountDocuments;
  UserConstructor.findByIdAndDelete = mockUserFindByIdAndDelete;
  UserConstructor.findByIdAndUpdate = mockUserFindByIdAndUpdate;
  UserConstructor.updateMany = mockUserUpdateMany;
  return { default: UserConstructor };
});

jest.unstable_mockModule('../src/models/Result.js', () => ({
  default: { find: jest.fn() },
}));

const mockStudentCreate = jest.fn();
const mockStudentDeleteOne = jest.fn();
const mockStudentUpdateMany = jest.fn();

jest.unstable_mockModule('../src/models/Student.js', () => ({
  default: {
    create: mockStudentCreate,
    deleteOne: mockStudentDeleteOne,
    updateMany: mockStudentUpdateMany,
  },
}));

const mockClassCreate = jest.fn();
const mockClassFind = jest.fn();
const mockClassFindOne = jest.fn();
const mockClassFindById = jest.fn();
const mockClassFindByIdAndUpdate = jest.fn();
const mockClassFindByIdAndDelete = jest.fn();

jest.unstable_mockModule('../src/models/Class.js', () => ({
  default: {
    create: mockClassCreate,
    find: mockClassFind,
    findOne: mockClassFindOne,
    findById: mockClassFindById,
    findByIdAndUpdate: mockClassFindByIdAndUpdate,
    findByIdAndDelete: mockClassFindByIdAndDelete,
  },
}));

const mockAuditLogCreate = jest.fn();
const mockAuditLogFind = jest.fn();

jest.unstable_mockModule('../src/models/AuditLog.js', () => ({
  default: {
    create: mockAuditLogCreate,
    find: mockAuditLogFind,
  },
}));

jest.unstable_mockModule('bcryptjs', () => ({
  default: {
    genSalt: jest.fn().mockResolvedValue('salt'),
    hash: jest.fn().mockResolvedValue('hashed'),
  },
}));

jest.unstable_mockModule('../src/utils/index.js', () => ({
  validatePasswordComplexity: jest.fn().mockReturnValue(null),
}));

const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
  getUsersByRole,
  deactivateUser,
  createClass,
  getAllClasses,
  deleteClass,
  getClassMembers,
  assignUsersToClass,
  promoteClass,
  getAuditLogs,
} = await import('../src/controllers/adminController.js');

describe('adminController', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      user: { id: 'admin1', role: 'admin' },
      body: {},
      params: {},
      query: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
  });

  describe('getAllUsers', () => {
    it('should return all users without password fields', async () => {
      const users = [{ full_name: 'John', role: 'student' }];
      mockUserFind.mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(users),
        }),
      });

      await getAllUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(users);
    });

    it('should handle errors', async () => {
      mockUserFind.mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockRejectedValue(new Error('DB Error')),
        }),
      });

      await getAllUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getUserById', () => {
    it('should return user by id', async () => {
      req.params = { id: 'user1' };
      const user = { _id: 'user1', full_name: 'John' };
      mockUserFindById.mockReturnValue({ select: jest.fn().mockResolvedValue(user) });

      await getUserById(req, res);

      expect(res.json).toHaveBeenCalledWith(user);
    });

    it('should return 404 if user not found', async () => {
      req.params = { id: 'nonexistent' };
      mockUserFindById.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });

      await getUserById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('createUser', () => {
    it('should return 400 if full_name is missing', async () => {
      req.body = { role: 'student' };

      await createUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Full name and role are required.' });
    });

    it('should return 400 if role is missing', async () => {
      req.body = { full_name: 'John Doe' };

      await createUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should create a student user with auto-generated school_id', async () => {
      req.body = { full_name: 'John Doe', role: 'student', assigned_class: 'Grade 10-A' };
      mockUserCountDocuments.mockResolvedValue(5);
      const savedUser = { _id: 'newUser1', full_name: 'John Doe', role: 'student', school_id: 'S6' };
      mockUserSave.mockResolvedValue(savedUser);
      mockStudentCreate.mockResolvedValue({});

      await createUser(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(mockStudentCreate).toHaveBeenCalled();
    });

    it('should create teacher with prefix T', async () => {
      req.body = { full_name: 'Mrs Smith', role: 'teacher', assigned_subjects: 'Math,Science' };
      mockUserCountDocuments.mockResolvedValue(3);
      mockUserSave.mockResolvedValue({ _id: 'newTeacher', role: 'teacher', school_id: 'T4' });

      await createUser(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(mockStudentCreate).not.toHaveBeenCalled();
    });

    it('should handle assigned_subjects as array', async () => {
      req.body = { full_name: 'Mrs Smith', role: 'teacher', assigned_subjects: ['Math', 'Science'] };
      mockUserCountDocuments.mockResolvedValue(0);
      mockUserSave.mockResolvedValue({ _id: 'newTeacher', role: 'teacher' });

      await createUser(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('updateUser', () => {
    it('should return 404 if user not found', async () => {
      req.params = { id: 'nonexistent' };
      req.body = { full_name: 'Updated' };
      mockUserFindById.mockResolvedValue(null);

      await updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should update user fields', async () => {
      req.params = { id: 'user1' };
      req.body = { full_name: 'Updated Name', email: 'new@email.com' };
      const user = {
        _id: 'user1',
        full_name: 'Old Name',
        email: 'old@email.com',
        role: 'student',
        save: jest.fn().mockResolvedValue(),
      };
      mockUserFindById.mockResolvedValue(user);

      await updateUser(req, res);

      expect(user.full_name).toBe('Updated Name');
      expect(user.email).toBe('new@email.com');
      expect(user.save).toHaveBeenCalled();
    });
  });

  describe('deleteUser', () => {
    it('should return 404 if user not found', async () => {
      req.params = { id: 'nonexistent' };
      mockUserFindById.mockResolvedValue(null);

      await deleteUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should delete student with associated Student profile', async () => {
      req.params = { id: 'student1' };
      mockUserFindById.mockResolvedValue({ _id: 'student1', role: 'student' });
      mockStudentDeleteOne.mockResolvedValue({});
      mockUserFindByIdAndDelete.mockResolvedValue({});

      await deleteUser(req, res);

      expect(mockStudentDeleteOne).toHaveBeenCalledWith({ user: 'student1' });
      expect(mockUserFindByIdAndDelete).toHaveBeenCalledWith('student1');
      expect(res.json).toHaveBeenCalledWith({ message: 'User deleted successfully' });
    });

    it('should delete non-student without deleting Student profile', async () => {
      req.params = { id: 'teacher1' };
      mockUserFindById.mockResolvedValue({ _id: 'teacher1', role: 'teacher' });
      mockUserFindByIdAndDelete.mockResolvedValue({});

      await deleteUser(req, res);

      expect(mockStudentDeleteOne).not.toHaveBeenCalled();
      expect(mockUserFindByIdAndDelete).toHaveBeenCalledWith('teacher1');
    });
  });

  describe('resetUserPassword', () => {
    it('should return 404 if user not found', async () => {
      req.params = { id: 'nonexistent' };
      req.body = { newPassword: 'newPass123' };
      mockUserFindById.mockResolvedValue(null);

      await resetUserPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 400 if newPassword is missing', async () => {
      req.params = { id: 'user1' };
      req.body = {};
      mockUserFindById.mockResolvedValue({ _id: 'user1' });

      await resetUserPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should reset password and set mustResetPassword flag', async () => {
      req.params = { id: 'user1' };
      req.body = { newPassword: 'newPass123' };
      const user = { _id: 'user1', save: jest.fn().mockResolvedValue() };
      mockUserFindById.mockResolvedValue(user);

      await resetUserPassword(req, res);

      expect(user.password).toBe('newPass123');
      expect(user.mustResetPassword).toBe(true);
      expect(user.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ message: 'Password reset successfully' });
    });
  });

  describe('getUsersByRole', () => {
    it('should return users filtered by role', async () => {
      req.params = { role: 'Student' };
      const users = [{ full_name: 'John', role: 'student' }];
      mockUserFind.mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(users),
        }),
      });

      await getUsersByRole(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(users);
    });
  });

  describe('deactivateUser', () => {
    it('should return 404 if user not found', async () => {
      req.params = { id: 'nonexistent' };
      mockUserFindById.mockResolvedValue(null);

      await deactivateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should set active to false', async () => {
      req.params = { id: 'user1' };
      const user = { _id: 'user1', active: true, save: jest.fn().mockResolvedValue() };
      mockUserFindById.mockResolvedValue(user);

      await deactivateUser(req, res);

      expect(user.active).toBe(false);
      expect(user.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ message: 'User deactivated successfully' });
    });
  });

  describe('createClass', () => {
    it('should create a class without form teacher', async () => {
      req.body = { name: 'Grade 10-A', description: 'Class 10A' };
      mockClassCreate.mockResolvedValue({ _id: 'class1', name: 'Grade 10-A' });
      mockAuditLogCreate.mockResolvedValue();

      await createClass(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should return 400 if form teacher is not a teacher', async () => {
      req.body = { name: 'Grade 10-A', formTeacher: 'student1' };
      mockUserFindById.mockResolvedValue({ _id: 'student1', role: 'student' });

      await createClass(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 if teacher is already assigned to another class', async () => {
      req.body = { name: 'Grade 10-A', formTeacher: 'teacher1' };
      mockUserFindById.mockResolvedValue({ _id: 'teacher1', role: 'teacher' });
      mockClassFindOne.mockResolvedValue({ _id: 'existingClass' });

      await createClass(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getAllClasses', () => {
    it('should return all classes', async () => {
      const classes = [{ name: 'Grade 10-A' }];
      mockClassFind.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(classes),
        }),
      });

      await getAllClasses(req, res);

      expect(res.json).toHaveBeenCalledWith(classes);
    });
  });

  describe('deleteClass', () => {
    it('should return 404 if class not found', async () => {
      req.params = { id: 'nonexistent' };
      mockClassFindById.mockResolvedValue(null);

      await deleteClass(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should delete class and unassign members', async () => {
      req.params = { id: 'class1' };
      mockClassFindById.mockResolvedValue({ _id: 'class1', name: 'Grade 10-A', formTeacher: 'teacher1' });
      mockUserFindByIdAndUpdate.mockResolvedValue();
      mockUserUpdateMany.mockResolvedValue();
      mockStudentUpdateMany.mockResolvedValue();
      mockAuditLogCreate.mockResolvedValue();
      mockClassFindByIdAndDelete.mockResolvedValue();

      await deleteClass(req, res);

      expect(mockUserFindByIdAndUpdate).toHaveBeenCalledWith('teacher1', { assigned_class: null });
      expect(mockUserUpdateMany).toHaveBeenCalled();
      expect(mockStudentUpdateMany).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ message: 'Class deleted successfully' });
    });
  });

  describe('getClassMembers', () => {
    it('should return members of a class', async () => {
      req.params = { name: 'Grade 10-A' };
      const members = [{ full_name: 'John', school_id: 'S1' }];
      mockUserFind.mockReturnValue({ select: jest.fn().mockResolvedValue(members) });

      await getClassMembers(req, res);

      expect(res.json).toHaveBeenCalledWith(members);
    });
  });

  describe('assignUsersToClass', () => {
    it('should assign users to a class', async () => {
      req.body = { className: 'Grade 10-A', userIds: ['u1', 'u2'] };
      mockUserUpdateMany.mockResolvedValue({ modifiedCount: 2 });
      mockStudentUpdateMany.mockResolvedValue({ modifiedCount: 2 });

      await assignUsersToClass(req, res);

      expect(res.json).toHaveBeenCalledWith({ message: 'Successfully assigned users to Grade 10-A' });
    });
  });

  describe('promoteClass', () => {
    it('should return 400 if fromClassName is missing', async () => {
      req.body = { toClassName: 'Grade 11-A' };

      await promoteClass(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 if toClassName is missing', async () => {
      req.body = { fromClassName: 'Grade 10-A' };

      await promoteClass(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should promote students from one class to another', async () => {
      req.body = { fromClassName: 'Grade 10-A', toClassName: 'Grade 11-A' };
      mockUserUpdateMany.mockResolvedValue({ modifiedCount: 5 });
      mockStudentUpdateMany.mockResolvedValue({ modifiedCount: 5 });

      await promoteClass(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Successfully moved students from Grade 10-A to Grade 11-A',
          count: 5,
        })
      );
    });
  });

  describe('getAuditLogs', () => {
    it('should return audit logs', async () => {
      const logs = [{ actionType: 'USER_CREATED' }];
      mockAuditLogFind.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue(logs),
            }),
          }),
        }),
      });

      await getAuditLogs(req, res);

      expect(res.json).toHaveBeenCalledWith(logs);
    });

    it('should filter by actionType when provided', async () => {
      req.query = { actionType: 'PASSWORD_RESET' };
      const logs = [];
      mockAuditLogFind.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue(logs),
            }),
          }),
        }),
      });

      await getAuditLogs(req, res);

      expect(res.json).toHaveBeenCalledWith(logs);
    });
  });
});
