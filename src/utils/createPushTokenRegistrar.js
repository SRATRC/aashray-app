const createPushTokenRegistrar = (register) => {
  let token = null;
  let registration = null;

  const ensureRegistered = () => {
    if (token) return Promise.resolve(token);
    if (registration) return registration;

    registration = Promise.resolve()
      .then(register)
      .then((nextToken) => {
        token = nextToken;
        return nextToken;
      })
      .finally(() => {
        registration = null;
      });

    return registration;
  };

  return { ensureRegistered };
};

module.exports = { createPushTokenRegistrar };
