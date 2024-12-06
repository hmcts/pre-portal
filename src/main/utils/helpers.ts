import { PreClient } from '../services/pre-api/pre-client';
import { PutEditInstruction, PutEditRequest } from '../services/pre-api/types';

import { v4 as uuid } from 'uuid';
import config from 'config';

export const validateId = (id: string): boolean => {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);
};

export const timeStringToSeconds = (timeString: string) => {
  const [h, m, s] = timeString.split(':').map(Number);
  return h * 3600 + m * 60 + s;
};

export const secondsToTimeString = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export const calculateTimeRemoved = (start: string, end: string): string => {
  const startTotalSeconds = timeStringToSeconds(start);
  const endTotalSeconds = timeStringToSeconds(end);

  const diffInSeconds = Math.abs(startTotalSeconds - endTotalSeconds);
  return secondsToTimeString(diffInSeconds);
};

export const getCurrentEditRequest = async (
  client: PreClient,
  xUserId: string,
  sourceRecordingId: string
): Promise<(PutEditRequest & { created_by?: string; modified_at?: string }) | null> => {
  const editRequests = await client.getMostRecentEditRequests(xUserId, sourceRecordingId);
  if (editRequests === null) {
    return null;
  }

  const editRequest = editRequests[0]
    ? ({
        id: editRequests[0].id,
        status: editRequests[0].status,
        source_recording_id: sourceRecordingId,
        edit_instructions: editRequests[0].edit_instruction.requestedInstructions,
        rejection_reason: editRequests[0].rejection_reason,
        jointly_agreed: editRequests[0].jointly_agreed,
        created_by: editRequests[0].created_by,
        modified_at: new Date(editRequests[0].modified_at).toLocaleDateString(),
      } as PutEditRequest & { created_by?: string; modified_at?: string })
    : ({
        id: uuid(),
        status: 'DRAFT',
        source_recording_id: sourceRecordingId,
        edit_instructions: [] as PutEditInstruction[],
      } as PutEditRequest & { created_by?: string; modified_at?: string });

  editRequest.edit_instructions = editRequest.edit_instructions.map(i => {
    return {
      ...i,
      difference: calculateTimeRemoved(i.start_of_cut, i.end_of_cut),
    };
  });
  return editRequest;
};

export const isFlagEnabled = (flag: string): boolean => {
  return config.get(flag)?.toString().toLowerCase() === 'true';
};

export const isStatusEditable = (status: string): boolean => {
  return ['DRAFT', 'REJECTED', 'COMPLETE'].includes(status);
};
