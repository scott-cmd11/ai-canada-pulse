import { redirect } from 'next/navigation';

export default function SourcesRedirect() {
  redirect('/insights?tab=sources');
}
