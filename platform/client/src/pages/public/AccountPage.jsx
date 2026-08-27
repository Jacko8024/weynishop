import MobileAccount from '../../components/mobile/MobileAccount.jsx';
import useDocumentTitle from '../../lib/useDocumentTitle.js';

/** Account route — dedicated mobile experience; simple centered card on desktop. */
export default function AccountPage() {
  useDocumentTitle('Account · Weynishop');
  return <MobileAccount />;
}
