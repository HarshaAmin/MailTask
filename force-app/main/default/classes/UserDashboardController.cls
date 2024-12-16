public class UserDashboardController {
  // Public properties to bind in the Visualforce page
  public String userName { get; set; }
  public User userData { get; set; }

  // Constructor to fetch the authenticated user's information
  public UserDashboardController() {
    // Fetch Salesforce user info
    this.userName = UserInfo.getUserName(); // Gets the logged-in user's username

    // You can customize the query to fetch more details or specific information
    this.userData = [
      SELECT Name, Email, UserRole.Name, Profile.Name
      FROM User
      WHERE Id = :UserInfo.getUserId()
      LIMIT 1
    ];
  }
}
