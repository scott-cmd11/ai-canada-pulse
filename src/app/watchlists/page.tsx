import { redirect } from 'next/navigation';

export default function WatchlistsRedirect() {
  redirect('/insights?tab=watchlists');
}
