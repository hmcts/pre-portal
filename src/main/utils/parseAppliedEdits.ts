import {PreClient} from "../services/pre-api/pre-client";
import {AppliedEditInstruction, PutEditInstruction, RecordingAppliedEdits} from "../services/pre-api/types";
import {secondsToTimeString, timeStringToSeconds} from "./helpers";

export const parseAppliedEdits = async (
  edits: string,
  client: PreClient,
  xUserId: string
): Promise<
  | {
  appliedEdits: AppliedEditInstruction[];
  approvedBy: string;
  approvedAt: string;
}
  | undefined
> => {
  if (!edits || edits == '') {
    return;
  }
  const editInstructions = JSON.parse(edits) as RecordingAppliedEdits;
  if (!editInstructions.editInstructions || !editInstructions.editRequestId) {
    return;
  }

  const appliedEdits = editInstructions.editInstructions.requestedInstructions.map(
    (instruction: PutEditInstruction) =>
      ({
        startOfCut: instruction.start_of_cut,
        start: timeStringToSeconds(instruction.start_of_cut),
        endOfCut: instruction.end_of_cut,
        end: timeStringToSeconds(instruction.end_of_cut),
        reason: instruction.reason,
      }) as unknown as AppliedEditInstruction
  );

  let timeDifference = 0;
  for (const edit of appliedEdits) {
    edit.runtimeReference = secondsToTimeString(edit.start - timeDifference);
    timeDifference += edit.end - edit.start;
  }

  const editRequest = await client.getEditRequest(xUserId, editInstructions.editRequestId);
  return {
    appliedEdits,
    approvedBy: editRequest?.approved_by || '',
    approvedAt: editRequest?.approved_at ? new Date(editRequest.approved_at).toLocaleDateString() : '',
  };
};
