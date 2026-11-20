import type { SVGAttributes } from 'react';
import Mascot from '@/components/brand/mascot';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return <Mascot {...props} />;
}
