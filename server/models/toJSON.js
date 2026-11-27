// Shared toJSON transform used by every schema:
// exposes _id as a string "id" and hides _id and __v from the JSON output
export function toJSONTransform(doc, ret) {
  const { _id, __v, ...rest } = ret;
  return { id: _id.toString(), ...rest };
}