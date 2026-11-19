"use client";

import { useParams } from "next/navigation";
import { PatientFlow } from "@/components/patient/PatientFlow";

/** রোগীর পেজ — চেম্বারের QR এখানে আনে: /d/<doctor-slug> */
export default function PatientPage() {
  const params = useParams<{ slug: string }>();
  const slug = (params?.slug ?? "").toString().toLowerCase();
  return <PatientFlow slug={slug} />;
}
