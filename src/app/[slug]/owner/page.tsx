import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function OwnerPage({ params }: Props) {
  const { slug } = await params;
  redirect(`/${slug}/owner/staff`);
}
