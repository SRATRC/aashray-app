export const handleUserNavigation = async (user, router) => {
  try {
    if (user) {
      if (user.pfp) {
        await router.replace('/home');
      } else {
        await router.replace('/imageCapture');
      }
    } else {
      await router.replace('/sign-in');
    }
  } catch (error) {
    console.error('Navigation error:', error);
    // Fallback navigation
    await router.replace('/sign-in');
  }
};
