export const handleUserNavigation = async (user, router) => {
  if (user) {
    if (user.pfp) {
      router.replace('/home');
    } else {
      router.replace('/imageCapture');
    }
  } else {
    router.replace('/sign-in');
  }
};
