// Simple in-memory user storage for development (when MongoDB is not available)
const bcrypt = require('bcryptjs');

// In-memory user storage
let users = [];
let nextId = 1;

class InMemoryUser {
  constructor(userData) {
    this._id = nextId++;
    this.name = userData.name;
    this.email = userData.email.toLowerCase();
    this.password = userData.password;
    this.role = userData.role || 'student';
    this.institution = userData.institution;
    this.department = userData.department;
    this.studentId = userData.studentId;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  // Hash password before saving
  async hashPassword() {
    if (this.password) {
      const salt = await bcrypt.genSalt(12);
      this.password = await bcrypt.hash(this.password, salt);
    }
  }

  // Compare password
  async comparePassword(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  }

  // Save user to memory
  async save() {
    // Check if user already exists
    const existingUser = users.find(user => user.email === this.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password before saving
    await this.hashPassword();
    
    // Add to users array
    users.push(this);
    console.log(`✅ User saved: ${this.name} (${this.email}) - Role: ${this.role}`);
    return this;
  }

  // Static methods
  static async findByEmail(email) {
    return users.find(user => user.email === email.toLowerCase());
  }

  static async findById(id) {
    return users.find(user => user._id === id);
  }

  static async findByStudentId(studentId) {
    return users.find(user => user.studentId === studentId);
  }

  static async find(query = {}) {
    if (Object.keys(query).length === 0) {
      return users;
    }
    
    return users.filter(user => {
      return Object.keys(query).every(key => user[key] === query[key]);
    });
  }

  // Create new user
  static async create(userData) {
    const user = new InMemoryUser(userData);
    return await user.save();
  }
}

module.exports = InMemoryUser;