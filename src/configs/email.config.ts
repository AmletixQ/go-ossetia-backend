export const EMAIL_TEMPLATES = {
  EMAIL_VERIFICATION: (otp: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Подтверждение email адреса</h2>
      <p>Здравствуйте!</p>
      <p>Ваш код подтверждения:</p>
      <h1 style="letter-spacing: 8px; font-size: 42px; color: #2563eb;">${otp}</h1>
      <p><strong>Код действителен 10 минут.</strong></p>
      <p>Если вы не запрашивали этот код — просто проигнорируйте письмо.</p>
      <hr>
    </div>
  `,

  PASSWORD_RESET: (otp: string) => `
    <div style="font-family: system-ui, sans-serif; max-width: 500px;">
      <h2>Сброс пароля</h2>
      <p>Вы запросили сброс пароля.</p>
      <p>Ваш код подтверждения:</p>
      <h1 style="font-size: 48px; letter-spacing: 8px; color: #dc2626;">${otp}</h1>
      <p>Код действителен 10 минут.</p>
      <p>Если вы не запрашивали сброс пароля — проигнорируйте это письмо.</p>
    </div>
  `,
} as const;
