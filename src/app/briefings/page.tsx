import { redirect } from 'next/navigation';

export default function BriefingsRedirect() {
  redirect('/insights?tab=briefings');
}
