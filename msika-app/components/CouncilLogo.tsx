import Image from "next/image";

export default function CouncilLogo({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/malawi-coat-of-arms.png"
      alt="Coat of arms of Malawi"
      width={166}
      height={148}
      className={`aspect-square rounded-full bg-white object-contain ${className}`}
    />
  );
}
