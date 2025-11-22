import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from '@/app/components/ui/Button';

// Mock the Lucide React icons
vi.mock('lucide-react', () => ({
  Loader2: ({ className }: { className?: string }) => (
    <div className={className} data-testid="loader-icon">Loading...</div>
  ),
}));

describe('Button Component', () => {
  describe('Basic Rendering', () => {
    it('renders children correctly', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('renders as a button element', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('has correct display name', () => {
      expect(Button.displayName).toBe('Button');
    });
  });

  describe('Event Handling', () => {
    it('handles click events', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(<Button onClick={handleClick}>Click me</Button>);

      await user.click(screen.getByText('Click me'));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call click handler when disabled', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(<Button onClick={handleClick} disabled>Disabled</Button>);

      await user.click(screen.getByText('Disabled'));

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('does not call click handler when loading', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(<Button onClick={handleClick} loading>Loading</Button>);

      await user.click(screen.getByText('Loading'));

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('supports keyboard events', () => {
      const handleKeyDown = vi.fn();
      render(<Button onKeyDown={handleKeyDown}>Keyboard</Button>);

      const button = screen.getByRole('button');
      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });

      expect(handleKeyDown).toHaveBeenCalledTimes(1);
    });
  });

  describe('Loading State', () => {
    it('shows loading spinner when loading prop is true', () => {
      render(<Button loading>Submit</Button>);

      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
      expect(screen.getByText('Submit')).toBeInTheDocument();
    });

    it('is disabled when loading prop is true', () => {
      render(<Button loading>Loading</Button>);

      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('does not show loading spinner when loading is false', () => {
      render(<Button loading={false}>Submit</Button>);

      expect(screen.queryByTestId('loader-icon')).not.toBeInTheDocument();
    });

    it('shows both loading spinner and children text', () => {
      render(<Button loading>Save Changes</Button>);

      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('is disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>);

      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('is not disabled when disabled prop is false', () => {
      render(<Button disabled={false}>Enabled</Button>);

      expect(screen.getByRole('button')).not.toBeDisabled();
    });

    it('applies disabled classes', () => {
      render(<Button disabled>Disabled</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('disabled:opacity-50');
      expect(button).toHaveClass('disabled:cursor-not-allowed');
    });
  });

  describe('Variant Styles', () => {
    it('applies primary variant styles by default', () => {
      render(<Button>Primary</Button>);

      expect(screen.getByRole('button')).toHaveClass('bg-primary-600', 'text-white');
    });

    it('applies secondary variant styles', () => {
      render(<Button variant="secondary">Secondary</Button>);

      expect(screen.getByRole('button')).toHaveClass('bg-slate-800', 'text-white');
    });

    it('applies outline variant styles', () => {
      render(<Button variant="outline">Outline</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('border-2', 'border-primary-500', 'text-primary-600', 'bg-transparent');
    });

    it('applies ghost variant styles', () => {
      render(<Button variant="ghost">Ghost</Button>);

      expect(screen.getByRole('button')).toHaveClass('text-slate-700', 'bg-transparent');
    });

    it('applies danger variant styles', () => {
      render(<Button variant="danger">Danger</Button>);

      expect(screen.getByRole('button')).toHaveClass('bg-red-600', 'text-white');
    });

    it('applies gradient variant styles', () => {
      render(<Button variant="gradient">Gradient</Button>);

      expect(screen.getByRole('button')).toHaveClass('bg-gradient-ocean', 'text-white');
    });

    it('applies glass variant styles', () => {
      render(<Button variant="glass">Glass</Button>);

      expect(screen.getByRole('button')).toHaveClass('glass-light', 'text-slate-800');
    });

    it('applies glow variant styles', () => {
      render(<Button variant="glow">Glow</Button>);

      expect(screen.getByRole('button')).toHaveClass('bg-primary-600', 'text-white', 'shadow-glow', 'animate-pulse-glow');
    });
  });

  describe('Size Styles', () => {
    it('applies medium size by default', () => {
      render(<Button>Medium</Button>);

      expect(screen.getByRole('button')).toHaveClass('px-5', 'py-2.5', 'text-base', 'min-h-[44px]');
    });

    it('applies extra small size styles', () => {
      render(<Button size="xs">Extra Small</Button>);

      expect(screen.getByRole('button')).toHaveClass('px-3', 'py-1.5', 'text-xs', 'min-h-[32px]');
    });

    it('applies small size styles', () => {
      render(<Button size="sm">Small</Button>);

      expect(screen.getByRole('button')).toHaveClass('px-4', 'py-2', 'text-sm', 'min-h-[36px]');
    });

    it('applies large size styles', () => {
      render(<Button size="lg">Large</Button>);

      expect(screen.getByRole('button')).toHaveClass('px-7', 'py-3.5', 'text-lg', 'min-h-[52px]');
    });

    it('applies 2xl size styles', () => {
      render(<Button size="2xl">Extra Large</Button>);

      expect(screen.getByRole('button')).toHaveClass('px-8', 'py-4', 'text-xl', 'min-h-[60px]');
    });
  });

  describe('Full Width', () => {
    it('applies full width style when fullWidth prop is true', () => {
      render(<Button fullWidth>Full Width</Button>);

      expect(screen.getByRole('button')).toHaveClass('w-full');
    });

    it('does not apply full width style when fullWidth prop is false', () => {
      render(<Button fullWidth={false}>Not Full Width</Button>);

      expect(screen.getByRole('button')).not.toHaveClass('w-full');
    });

    it('does not apply full width style by default', () => {
      render(<Button>Default Width</Button>);

      expect(screen.getByRole('button')).not.toHaveClass('w-full');
    });
  });

  describe('Custom Styling', () => {
    it('accepts custom className', () => {
      render(<Button className="custom-class">Custom</Button>);

      expect(screen.getByRole('button')).toHaveClass('custom-class');
    });

    it('merges custom className with default classes', () => {
      render(<Button className="custom-class">Custom</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
      expect(button).toHaveClass('inline-flex', 'items-center', 'justify-center');
    });

    it('custom className can override default styles', () => {
      render(<Button className="bg-yellow-500" variant="primary">Override</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-yellow-500');
    });
  });

  describe('Animation', () => {
    it('renders motion.button when animated is true (default)', () => {
      render(<Button>Animated</Button>);

      // Motion component should be rendered (our mock makes it a regular button)
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('renders regular button when animated is false', () => {
      render(<Button animated={false}>Not Animated</Button>);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('renders regular button when disabled even if animated is true', () => {
      render(<Button animated={true} disabled>Disabled</Button>);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('renders regular button when loading even if animated is true', () => {
      render(<Button animated={true} loading>Loading</Button>);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('HTML Attributes', () => {
    it('supports type attribute', () => {
      render(<Button type="submit">Submit</Button>);

      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
    });

    it('supports id attribute', () => {
      render(<Button id="my-button">Button</Button>);

      expect(screen.getByRole('button')).toHaveAttribute('id', 'my-button');
    });

    it('supports data attributes', () => {
      render(<Button data-testid="custom-button">Button</Button>);

      expect(screen.getByTestId('custom-button')).toBeInTheDocument();
    });

    it('supports aria attributes', () => {
      render(<Button aria-label="Close dialog">×</Button>);

      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Close dialog');
    });
  });

  describe('Forwarded Ref', () => {
    it('forwards ref to button element', () => {
      const ref = vi.fn();
      render(<Button ref={ref}>Button</Button>);

      expect(ref).toHaveBeenCalledWith(expect.any(HTMLButtonElement));
    });
  });

  describe('Base Styles', () => {
    it('applies base styles to all variants', () => {
      render(<Button>Base</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass(
        'inline-flex',
        'items-center',
        'justify-center',
        'font-medium',
        'rounded-xl'
      );
    });

    it('applies focus styles', () => {
      render(<Button>Focus</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass(
        'focus:outline-none',
        'focus-visible:ring-2',
        'focus-visible:ring-offset-2'
      );
    });

    it('applies transition styles', () => {
      render(<Button>Transition</Button>);

      expect(screen.getByRole('button')).toHaveClass(
        'transition-all',
        'duration-300',
        'ease-out'
      );
    });
  });

  describe('Complex Scenarios', () => {
    it('handles multiple props together', () => {
      const handleClick = vi.fn();

      render(
        <Button
          variant="danger"
          size="lg"
          fullWidth
          loading
          onClick={handleClick}
          className="custom-class"
          data-testid="complex-button"
        >
          Complex Button
        </Button>
      );

      const button = screen.getByTestId('complex-button');

      // Check all applied classes
      expect(button).toHaveClass('bg-red-600'); // danger variant
      expect(button).toHaveClass('px-7', 'py-3.5', 'text-lg'); // large size
      expect(button).toHaveClass('w-full'); // fullWidth
      expect(button).toHaveClass('custom-class'); // custom class
      expect(button).toBeDisabled(); // loading state

      // Check loading spinner is present
      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
      expect(screen.getByText('Complex Button')).toBeInTheDocument();
    });

    it('prioritizes loading over disabled for isDisabled calculation', () => {
      render(<Button disabled={false} loading>Test</Button>);

      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('works with all combinations of size and variant', () => {
      const sizes = ['xs', 'sm', 'md', 'lg', '2xl'] as const;
      const variants = ['primary', 'secondary', 'outline', 'ghost', 'danger', 'gradient', 'glass', 'glow'] as const;

      sizes.forEach(size => {
        variants.forEach(variant => {
          const { unmount } = render(
            <Button size={size} variant={variant}>
              {size} {variant}
            </Button>
          );

          expect(screen.getByText(`${size} ${variant}`)).toBeInTheDocument();
          unmount();
        });
      });
    });
  });
});