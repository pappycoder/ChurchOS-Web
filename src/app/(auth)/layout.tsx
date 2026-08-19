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
      <div className="w-full overflow-hidden relative flex-wrap flex block h-screen">
        <div className="flex w-full">
          {/* Left: Illustration Panel */}
          <div className="hidden lg:flex lg:w-5/12">
            <div className="login-background relative flex items-center justify-center flex-wrap h-screen w-full">
              {/* Decorative background images */}
              <div className="bg-overlay-img absolute w-full h-full">
                <Image src="/auth/bg-01.png" alt="" className="bg-img-1" width={300} height={300} />
                <Image src="/auth/bg-02.png" alt="" className="bg-img-2" width={100} height={150} />
                <Image src="/auth/bg-03.png" alt="" className="bg-img-3" width={80} height={80} />
              </div>

              {/* Content card */}
              <div className="authentication-card w-full relative z-[2] px-10 py-10">
                <div className="authen-overlay-item w-full">
                  <h1 className="text-white font-bold text-center" style={{ fontSize: "40px", lineHeight: 1.3 }}>
                    Empowering people <br /> through seamless church <br /> management.
                  </h1>
                  <div className="my-4 mx-auto text-center max-w-[400px]">
                    <Image src="/auth/authentication-bg-01.png" alt="Church Management" width={400} height={250} className="w-full h-auto" priority />
                  </div>
                  <p className="text-white font-semibold text-center" style={{ fontSize: "20px" }}>
                    Efficiently manage your congregation, streamline <br /> operations effortlessly.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Form Panel */}
          <div className="w-full lg:w-7/12">
            <div className="flex justify-center items-center h-screen overflow-auto flex-wrap">
              <div className="w-full md:w-[58%] h-screen flex flex-col justify-between p-4 pb-0 mx-auto">
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
