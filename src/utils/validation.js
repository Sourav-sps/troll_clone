function isValidEmail(email, password) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = emailRegex.test(email);
  return isEmailValid;
}

function isValidPassword(password) {
  return password.length >= 8;
}

export { isValidEmail, isValidPassword };
