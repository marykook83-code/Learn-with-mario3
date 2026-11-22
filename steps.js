export function buildSteps(chapter) {
  const steps = [];
  chapter.scenes.forEach((scene, sceneIndex) => {
    let current = null;
    scene.items.forEach((item) => {
      const last = current?.items[current.items.length - 1];
      const startsNewStep =
        !current ||
        Boolean(item.question) ||
        Boolean(last.question) ||
        (item.who === "student" && last.who !== "student");
      if (startsNewStep) {
        current = { sceneIndex, sceneStart: !current, items: [] };
        steps.push(current);
      }
      current.items.push(item);
    });
  });
  return steps;
}
