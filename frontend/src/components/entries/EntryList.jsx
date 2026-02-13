import { Stack, Typography } from "@mui/material";
import EntryItem from "./EntryItem";

function EntryList({
  entries,
  onChangeStatus,
  onTranscribe,
  transcribingIds,
  updatingEntryId
}) {
  if (!entries.length) {
    return <Typography color="text.secondary">No entries registered yet.</Typography>;
  }

  return (
    <Stack spacing={2}>
      {entries.map((entry) => (
        <EntryItem
          key={entry._id}
          entry={entry}
          onChangeStatus={onChangeStatus}
          onTranscribe={onTranscribe}
          transcribing={transcribingIds.has(entry._id)}
          updatingStatus={updatingEntryId === entry._id}
        />
      ))}
    </Stack>
  );
}

export default EntryList;
