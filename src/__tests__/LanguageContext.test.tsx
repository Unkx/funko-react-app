import React, { useContext } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, beforeEach } from "vitest";
import { LanguageProvider, LanguageContext } from "../LanguageContext";

describe("LanguageContext", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("provides default language when none saved", () => {
    const Consumer = () => {
      const { language } = useContext(LanguageContext);
      return <div data-testid="lang">{language}</div>;
    };

    render(
      <LanguageProvider>
        <Consumer />
      </LanguageProvider>
    );

    expect(screen.getByTestId("lang")).toHaveTextContent("EN");
  });

  it("reads preferred language from localStorage on mount", () => {
    localStorage.setItem("preferredLanguage", "PL");

    const Consumer = () => {
      const { language } = useContext(LanguageContext);
      return <div data-testid="lang">{language}</div>;
    };

    render(
      <LanguageProvider>
        <Consumer />
      </LanguageProvider>
    );

    expect(screen.getByTestId("lang")).toHaveTextContent("PL");
  });

  it("updates language and saves to localStorage via setLanguage", () => {
    const Consumer = () => {
      const { language, setLanguage } = useContext(LanguageContext);
      return (
        <div>
          <div data-testid="lang">{language}</div>
          <button data-testid="btn" onClick={() => setLanguage("DE")}>Set DE</button>
        </div>
      );
    };

    render(
      <LanguageProvider>
        <Consumer />
      </LanguageProvider>
    );

    const btn = screen.getByTestId("btn");
    fireEvent.click(btn);

    expect(screen.getByTestId("lang")).toHaveTextContent("DE");
    expect(localStorage.getItem("preferredLanguage")).toBe("DE");
  });
});
