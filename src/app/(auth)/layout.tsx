"use client";

import Image from "next/image";
import { ThemeToggle } from "@/components/shared/theme-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      <div className="w-full overflow-hidden position-relative flex-wrap d-block vh-100">
        <div className="row">
          {/* Left: Illustration Panel (hidden on mobile, col-lg-5) */}
          <div className="col-lg-5 d-none d-lg-flex">
            <div className="login-background position-relative d-flex align-items-center justify-content-center flex-wrap vh-100 w-100">
              {/* Decorative background images */}
              <div className="bg-overlay-img position-absolute w-100 h-100">
                <Image
                  src="/auth/bg-01.png"
                  alt=""
                  className="bg-img-1"
                  width={300}
                  height={300}
                />
                <Image
                  src="/auth/bg-02.png"
                  alt=""
                  className="bg-img-2"
                  width={100}
                  height={150}
                />
                <Image
                  src="/auth/bg-03.png"
                  alt=""
                  className="bg-img-3"
                  width={80}
                  height={80}
                />
              </div>

              {/* Content card */}
              <div className="authentication-card w-100 position-relative" style={{ zIndex: 2 }}>
                <div className="authen-overlay-item w-100">
                  <h1 className="text-white fw-bold text-center" style={{ fontSize: "clamp(26px, 3vw, 40px)", lineHeight: 1.3 }}>
                    Empowering people <br /> through seamless church <br /> management.
                  </h1>
                  <div className="my-4 mx-auto text-center" style={{ maxWidth: 400 }}>
                    <Image
                      src="/auth/authentication-bg-01.png"
                      alt="Church Management"
                      width={400}
                      height={250}
                      className="img-fluid"
                      priority
                    />
                  </div>
                  <p className="text-white fw-semibold text-center" style={{ fontSize: "clamp(16px, 1.5vw, 20px)" }}>
                    Efficiently manage your congregation, streamline <br /> operations effortlessly.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Form Panel */}
          <div className="col-lg-7 col-md-12 col-sm-12">
            <div className="row justify-content-center align-items-center vh-100 overflow-auto flex-wrap">
              <div className="col-md-7 mx-auto vh-100 d-flex flex-column justify-content-between p-4 pb-0">
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Theme Toggle */}
      <ThemeToggle />
    </div>
  );
}
