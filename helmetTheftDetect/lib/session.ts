interface UserData {
  email: string;
  helmetCode: string;
  role: string;
}

class UserSessionClass {
  email: string = "";
  helmetCode: string = "";
  role: string = "OWNER";

  setUser(user: UserData) {
    this.email = user.email ?? "";
    this.helmetCode = user.helmetCode ?? "";
    this.role = user.role ?? "OWNER";
  }

  clear() {
    this.email = "";
    this.helmetCode = "";
    this.role = "OWNER";
  }
}

export const UserSession = new UserSessionClass();
