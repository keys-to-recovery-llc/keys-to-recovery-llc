import React from 'react';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';

function H({ children }) {
  return <h2 className="text-xl md:text-2xl font-light text-white mt-10 mb-3">{children}</h2>;
}
function P({ children }) {
  return <p className="text-white/70 leading-relaxed mb-4">{children}</p>;
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black">
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <Shield className="h-10 w-10 text-[#d4a574] mb-6" />
          <h1 className="text-4xl md:text-5xl font-light text-white mb-4">Privacy Policy</h1>
          <p className="text-white/50 mb-2">Keys to Recovery LLC · keystorecoveryllc.com</p>
          <p className="text-white/50 mb-8">Effective October 23, 2026</p>

          <P>
            Keys to Recovery LLC ("we," "us") runs this website and the Keys to Recovery app.
            This policy explains, in plain language, what information we collect when you use
            them, what we do with it, and the choices you have. We keep this short on purpose:
            we collect very little, we sell nothing, and we run no advertising trackers.
          </P>

          <H>What we collect</H>
          <P>
            <span className="text-white font-medium">Account information.</span> If you create
            an account, we store your name and email address and a scrambled (hashed) version of
            your password. We never store your password in readable form.
          </P>
          <P>
            <span className="text-white font-medium">Forms you send us.</span> When you submit a
            housing application, a contact message, or feedback, we store what you typed — which
            can include your phone number and any personal background you choose to share with us
            about your situation and recovery — in our database, so we can read it, respond to
            you, and review applications.
          </P>
          <P>
            <span className="text-white font-medium">Basic technical records.</span> Like nearly
            every website, our servers keep short-lived logs (such as IP address, browser type,
            and pages visited) needed to run and secure the site. For signed-in users we also
            keep internal records of pages visited, used only to operate and improve the site.
          </P>
          <P>
            <span className="text-white font-medium">Cookies.</span> We use only the cookies
            needed to keep you signed in and the site working. We do not use advertising or
            cross-site tracking cookies.
          </P>

          <H>What we do with it</H>
          <P>
            We use your information to run the site, keep your account working, review housing
            applications, answer your messages, and protect the safety of our residents,
            applicants, and staff. That is the whole list.
          </P>

          <H>What we never do</H>
          <P>
            We do not sell your personal information. We do not share it with anyone for
            marketing. We do not use it for advertising. We would only disclose information if
            the law required it, or if it were necessary to protect someone's safety.
          </P>

          <H>Donations</H>
          <P>
            Donations are made through Cash App, an external service. When you donate, Cash App
            handles your payment — we never receive or store your card or bank details.
          </P>

          <H>The resource directory</H>
          <P>
            Our directory lists publicly available information about organizations — names,
            phone numbers, websites, and services they publish themselves. It does not list
            private information about individuals.
          </P>

          <H>Your choices</H>
          <P>
            You may ask us at any time what information we hold about you, ask us to correct it,
            or ask us to delete it. To delete your account and associated information, see our{' '}
            <Link to="/DeleteAccount" className="text-[#d4a574] hover:underline">account deletion page</Link>{' '}
            or email us at{' '}
            <a href="mailto:Support@keystorecoveryllc.com" className="text-[#d4a574] hover:underline">
              Support@keystorecoveryllc.com
            </a>
            .
          </P>

          <H>Children</H>
          <P>This site is not directed to children under 13, and we do not knowingly collect information from them.</P>

          <H>Changes and contact</H>
          <P>
            If we change this policy, we will post the new version here with a new effective
            date. Questions: Support@keystorecoveryllc.com or (253) 240-9724.
          </P>
        </div>
      </section>
    </div>
  );
}
