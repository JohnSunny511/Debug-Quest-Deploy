const STORAGE_KEY = "debug_quest_learning_progress_v1";

export const loadLearningProgress = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return {};
    const parsed = JSON.parse(stored);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    return {};
  }
};

export const saveLearningProgress = (progress) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
};

export const setModuleDoneState = (moduleId, done) => {
  const current = loadLearningProgress();
  const updated = {
    ...current,
    [moduleId]: Boolean(done),
  };
  saveLearningProgress(updated);
  return updated;
};

export const toggleModuleDoneState = (moduleId) => {
  const current = loadLearningProgress();
  const updated = {
    ...current,
    [moduleId]: !current[moduleId],
  };
  saveLearningProgress(updated);
  return updated;
};

export const resetLearningProgress = () => {
  saveLearningProgress({});
  return {};
};
