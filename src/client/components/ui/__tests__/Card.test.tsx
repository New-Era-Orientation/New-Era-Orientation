import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/client/components/ui/Card';

describe('Card Component', () => {
    it('renders Card with children', () => {
        render(
            <Card>
                <CardContent>Card content</CardContent>
            </Card>
        );
        expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('renders CardHeader correctly', () => {
        render(
            <Card>
                <CardHeader>
                    <CardTitle>Title</CardTitle>
                    <CardDescription>Description</CardDescription>
                </CardHeader>
            </Card>
        );
        expect(screen.getByText('Title')).toBeInTheDocument();
        expect(screen.getByText('Description')).toBeInTheDocument();
    });

    it('renders CardFooter correctly', () => {
        render(
            <Card>
                <CardFooter>Footer content</CardFooter>
            </Card>
        );
        expect(screen.getByText('Footer content')).toBeInTheDocument();
    });

    it('applies custom className', () => {
        render(
            <Card className="custom-class" data-testid="card">
                Content
            </Card>
        );
        expect(screen.getByTestId('card')).toHaveClass('custom-class');
    });
});
