import React from "react";
import "../asserts/style/footer.css";
import face from "../asserts/icon/facebook.png";
import insta from "../asserts/icon/instagram.png";

export default function Footer() {
  const socials = [
    { href: 'https://facebook.com', icon: face, label: 'Facebook' },
    { href: 'https://instagram.com', icon: insta, label: 'Instagram' }
  ];

  return (
    <footer className="site-footer section--compact">
      <div className="layout-container">
        <div className="site-footer__inner surface surface--inset">
          <div className="site-footer__brand">
            <span className="site-footer__logo">TS</span>
            <div>
              <h4>Tech Store</h4>
              <p className="text-muted">Tools and accessories for ambitious teams.</p>
            </div>
          </div>
          <div className="site-footer__links" aria-label="Social media">
            {socials.map((social) => (
              <a key={social.href} href={social.href} target="_blank" rel="noreferrer" className="site-footer__link">
                <img src={social.icon} alt={social.label} />
              </a>
            ))}
          </div>
        </div>
        <div className="site-footer__meta">
          <span>© 2024 Tech Store. All rights reserved.</span>
          <span className="text-muted">Crafted with care for modern commerce.</span>
        </div>
      </div>
    </footer>
  );
}
