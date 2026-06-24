import React from 'react';


interface StaticPageHeroProps {
    title: string;
}

const StaticPageHero: React.FC<StaticPageHeroProps> = ({ title }) => {
    return (
        <section className="relative py-[30px] md:py-[60px] lg:py-[87px] bg-[linear-gradient(90deg,#FBF7FD_0%,#EBDDF7_100%)] text-center">
          <div className="container">
            <h1 className="headings-web-h2-headline text-[#000000] font-bold tracking-tight">
              {title}
            </h1>
          </div>
        </section>
    );
};

export default StaticPageHero;
