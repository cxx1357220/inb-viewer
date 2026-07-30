async function releaseSessions(
  ...sessions
) {
  await Promise.all(
    sessions.map(async (session) => {
      if (!session.release) return;
      await session.release();
    })
  );
}
module.exports = {
    releaseSessions
}