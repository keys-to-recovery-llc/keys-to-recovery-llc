import React from 'react';
import { Trash2 } from 'lucide-react';

function P({ children }) {
  return <p className="text-white/70 leading-relaxed mb-4">{children}</p>;
}

export default function DeleteAccountPage() {
  return (
    <div className="min-h-screen bg-black">
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <Trash2 className="h-10 w-10 text-[#d4a574] mb-6" />
          <h1 className="text-4xl md:text-5xl font-light text-white mb-4">Delete Your Account</h1>
          <p className="text-white/50 mb-8">Keys to Recovery LLC · keystorecoveryllc.com</p>

          <P>
            You can have your Keys to Recovery account — and the personal information tied to
            it — deleted at any time. Deletion requests are handled by a person, not a robot,
            so we can make sure we are deleting the right account.
          </P>

          <h2 className="text-xl md:text-2xl font-light text-white mt-10 mb-3">How to request deletion</h2>
          <P>
            Email{' '}
            <a href="mailto:Support@keystorecoveryllc.com?subject=Delete%20my%20account" className="text-[#d4a574] hover:underline">
              Support@keystorecoveryllc.com
            </a>{' '}
            from the email address on your account, with the subject "Delete my account." If you
            can't use that email address, call us at (253) 240-9724 and we will verify your
            identity another way.
          </P>

          <h2 className="text-xl md:text-2xl font-light text-white mt-10 mb-3">What gets deleted</h2>
          <P>
            Your account (name, email, password record) and the form submissions tied to it —
            housing applications, contact messages, and feedback you sent while signed in. We
            complete deletions within 30 days of verifying the request and confirm by email
            when it is done.
          </P>

          <h2 className="text-xl md:text-2xl font-light text-white mt-10 mb-3">What we may keep</h2>
          <P>
            If the law requires us to keep a record (for example, records connected to a
            housing placement or a financial transaction), we keep only that record, only for
            as long as required, and it is never used for any other purpose.
          </P>

          <P>
            Changed your mind before we process it? Just email us at the same address and we
            will cancel the request.
          </P>
        </div>
      </section>
    </div>
  );
}
