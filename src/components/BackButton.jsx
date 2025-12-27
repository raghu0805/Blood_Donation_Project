import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from './Button';

export function BackButton({ to, className = "", variant = "ghost" }) {
    const navigate = useNavigate();

    const handleBack = () => {
        if (to) {
            navigate(to);
        } else {
            navigate(-1);
        }
    };

    return (
        <Button
            variant={variant}
            size="sm"
            onClick={handleBack}
            className={`rounded-full h-10 w-10 p-0 flex items-center justify-center ${className}`}
            title="Go Back"
        >
            <ArrowLeft className="h-5 w-5" />
        </Button>
    );
}
