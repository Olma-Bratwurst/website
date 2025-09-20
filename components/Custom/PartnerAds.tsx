// components/PartnerAds.tsx
"use client";
import Image from "next/image";

// // import static files (lives under /public or /app with asset imports)
// import partner1 from "@/(public)/partner_img/bier.png";
// import partner2 from "@/(public)/partner_img/jumbo.png";
// import partner3 from "@/(public)/partner_img/ mountain.png";

///Users/shirley/Documents/STARTHACK25/website/public/partner_img/bier.png
const ADS = [
  { img: "/image/22.jpeg", text: "We saw you spent CHF 141 on beer. \n Get 1-for-1 drinks at Schützengarten." },
  { img: "/image/44.jpeg", text: "Changing up your home? Get 10% off every CHF500." },
  { img: "/image/33.jpeg", text: "Love the mountains? Enjoy the views at Säntis this September." },
];

export default function PartnerAds() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h2 className="mb-4 text-lg font-semibold text-gray-800">Wallet-friendly Deals For You</h2>
      <div className="flex gap-4 justify-center">
        {ADS.map((ad, i) => (
          <div key={i} className="w-64 rounded-lg overflow-hidden bg-white shadow-md flex flex-col">
            <div className="relative h-28 w-full bg-gray-100">
              <Image
                src={ad.img}
                alt={`Partner ${i + 1}`}
                fill
                sizes="256px"
                className="object-cover"
                priority
              />
            </div>
            <div className="flex-1 p-3">
              <p className="text-xs text-gray-700">{ad.text}</p>
            </div>
            <div className="px-3 pb-3">
              <button disabled className="w-full rounded-md bg-indigo-600 text-white text-xs font-medium py-1.5 opacity-80 cursor-default">
                Learn more
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
