import HandoffSummary from "../models/handoffSummary.js";

export const getHandoffSummaryById = async (summaryId) => {
  return await HandoffSummary.findById(summaryId)
    .populate("sourceNotesRefs")
    .exec();
};

export const getHandoffSummariesForEncounter = async (encounterId) => {
  return await HandoffSummary.find({ encounterId })
    .sort({ generationTimestamp: -1 })
    .exec();
};

export const saveHandoffSummary = async (handoffSummary) => {
  return await handoffSummary.save();
};

export const updateHandoffSummary = async (summaryId, updateData) => {
  return await HandoffSummary.findByIdAndUpdate(summaryId, updateData, {
    new: true,
    runValidators: true,
  }).exec();
};
