export type LoginPayload = {
  email: string;
  password: string;
  role: "student" | "teacher";
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  role: "student" | "teacher";
};

export type AuthUserDTO = {
  id: string;
  name: string;
  email: string;
  role: "student" | "teacher";
};

export type AuthTokensDTO = {
  accessToken: string;
  refreshToken: string;
};

export type AuthSessionDTO = {
  user: AuthUserDTO;
  tokens: AuthTokensDTO;
};

const SESSION_KEY = "auth_session_v1";

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const makeUserIdFromEmail = (email: string) => normalizeEmail(email); // простий стабільний id для мок-версії

const randomToken = () =>
  `mock_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;

const saveSession = (session: AuthSessionDTO) => {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

const readSession = (): AuthSessionDTO | null => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthSessionDTO;
  } catch {
    return null;
  }
};

const clearSession = () => {
  localStorage.removeItem(SESSION_KEY);
};

export const authApi = {
  async register(payload: RegisterPayload): Promise<AuthSessionDTO> {
    // Мок: вважаємо, що реєстрація завжди успішна
    const email = normalizeEmail(payload.email);

    if (!email.includes("@")) {
      // щоб було як “валідація бекенду”
      throw new Error("Invalid email");
    }
    if (!payload.password || payload.password.length < 4) {
      throw new Error("Password too short");
    }
    if (!payload.name.trim()) {
      throw new Error("Name required");
    }

    const session: AuthSessionDTO = {
      user: {
        id: makeUserIdFromEmail(email),
        name: payload.name.trim(),
        email,
        role: payload.role,
      },
      tokens: { accessToken: randomToken(), refreshToken: randomToken() },
    };

    saveSession(session);
    return session;
  },

  async login(payload: LoginPayload): Promise<AuthSessionDTO> {
    const email = normalizeEmail(payload.email);

    if (!email.includes("@")) {
      throw new Error("Invalid email");
    }
    if (!payload.password) {
      throw new Error("Password required");
    }

    // Мок: “логінимо” будь-кого
    const session: AuthSessionDTO = {
      user: {
        id: makeUserIdFromEmail(email),
        name: email.split("@")[0],
        email,
        role: payload.role,
      },
      tokens: { accessToken: randomToken(), refreshToken: randomToken() },
    };

    saveSession(session);
    return session;
  },

  async loadSession(): Promise<AuthSessionDTO | null> {
    return readSession();
  },

  async logout(): Promise<void> {
    clearSession();
  },

  // (на майбутнє, коли буде реальний бекенд)
  async me(): Promise<AuthUserDTO | null> {
    const session = readSession();
    return session?.user ?? null;
  },
};
