const stories = [
  {
    id: "PACE-001",
    title: "User Authentication API",
    description: "As a user, I want to register and log in with email and password so I can securely access my account.",
    acceptance_criteria: [
      "POST /auth/register - accepts email and password, returns user object",
      "POST /auth/login - validates credentials, returns JWT token",
      "GET /auth/me - returns current user from JWT",
      "Passwords must be hashed before storage"
    ],
    priority: "High",
    status: "To Do"
  },
  {
    id: "PACE-002",
    title: "Todo List CRUD API",
    description: "As a user, I want to create, read, update and delete todos so I can manage my tasks.",
    acceptance_criteria: [
      "POST /todos - create a new todo with title and description",
      "GET /todos - return all todos for the user",
      "PUT /todos/:id - update a todo by id",
      "DELETE /todos/:id - delete a todo by id"
    ],
    priority: "High",
    status: "To Do"
  },
  {
    id: "PACE-003",
    title: "User Profile Management",
    description: "As a user, I want to view and update my profile information so I can keep my account up to date.",
    acceptance_criteria: [
      "GET /profile - return user profile details",
      "PUT /profile - update name, email, avatar",
      "DELETE /profile - delete account and all associated data"
    ],
    priority: "Medium",
    status: "To Do"
  },
  {
    id: "PACE-004",
    title: "Notifications API",
    description: "As a user, I want to receive and manage notifications so I can stay informed about important events.",
    acceptance_criteria: [
      "GET /notifications - return all notifications for user",
      "PUT /notifications/:id/read - mark notification as read",
      "DELETE /notifications - clear all notifications"
    ],
    priority: "Low",
    status: "To Do"
  }
];

export function getStories() {
  return stories;
}

export function getStory(id) {
  return stories.find(s => s.id === id) || stories[0];
}
