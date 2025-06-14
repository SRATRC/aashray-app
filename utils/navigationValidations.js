export const handleUserNavigation = async (user, router) => {
  try {
    if (user) {
      if (!user.pfp) {
        await router.replace('/imageCapture');
        return;
      }

      if (
        !user.issuedto ||
        !user.email ||
        !user.mobno ||
        !user.address ||
        !user.dob ||
        !user.gender ||
        !user.idType ||
        !user.idNo ||
        !user.country ||
        !user.state ||
        !user.city ||
        !user.pin ||
        !user.center
      ) {
        await router.replace('/completeProfile');
        return;
      }

      await router.replace('/home');
    } else {
      await router.replace('/sign-in');
    }
  } catch (error) {
    console.error('Navigation error:', error);
    await router.replace('/sign-in');
  }
};
