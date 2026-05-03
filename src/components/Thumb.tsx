import { BuildingIcon } from "./Icon";

export function Thumb({
  size = 52,
  rounded = 11,
}: {
  size?: number;
  rounded?: number;
}) {
  return (
    <div
      className="shrink-0 bg-[#E8DFD0] flex items-center justify-center text-[#8C7A5E]"
      style={{ width: size, height: size, borderRadius: rounded }}
    >
      <BuildingIcon size={Math.max(14, size / 3)} />
    </div>
  );
}
