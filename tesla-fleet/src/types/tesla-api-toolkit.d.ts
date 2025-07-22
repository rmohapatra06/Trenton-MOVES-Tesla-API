declare module 'tesla-api-toolkit' {
    export class VehicleError extends Error {
        constructor(message: string);
    }

    export class Vehicle {
        honkHorn(duration: number): Promise<void>;
    }

    export class VehicleCache {
        constructor(
            publicKeyPEM: string,
            privateKeyPEM: string,
            getAccessToken: (id: string) => Promise<string>,
            refreshAccessToken: (id: string) => Promise<string>
        );
        
        ensureVehicle(id: string, vin: string): Vehicle;
        containsVehicle(id: string): boolean;
        getVehicle(id: string): Vehicle;
    }
} 