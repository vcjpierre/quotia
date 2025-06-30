import { Calculator, FileText, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { Link, useLocation } from "wouter";

export function Navigation() {
  const { theme, toggleTheme } = useTheme();
  const [location] = useLocation();

  return (
    <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-3">
              <div className="bg-primary text-white rounded-lg p-2">
                <Calculator className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Freelance Calculator
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Professional billing made easy
                </p>
              </div>
            </Link>
            
            <nav className="hidden md:flex items-center space-x-6">
              <Link
                href="/calculator"
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location === "/" || location === "/calculator"
                    ? "bg-primary/10 text-primary"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                <Calculator className="h-4 w-4" />
                <span>Calculator</span>
              </Link>
              
              <Link
                href="/quotes"
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location === "/quotes"
                    ? "bg-primary/10 text-primary"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                <FileText className="h-4 w-4" />
                <span>Saved Quotes</span>
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleTheme}
              className="p-2"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-slate-200 dark:border-slate-700">
        <div className="px-4 py-3 space-y-1">
          <Link
            href="/calculator"
            className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              location === "/" || location === "/calculator"
                ? "bg-primary/10 text-primary"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
          >
            <Calculator className="h-4 w-4" />
            <span>Calculator</span>
          </Link>
          
          <Link
            href="/quotes"
            className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              location === "/quotes"
                ? "bg-primary/10 text-primary"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Saved Quotes</span>
          </Link>
        </div>
      </div>
    </header>
  );
}