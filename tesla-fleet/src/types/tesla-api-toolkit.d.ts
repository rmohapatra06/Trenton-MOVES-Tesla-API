declare module 'tesla-api-toolkit' {
    export class VehicleCache {
        constructor(
            publicKeyPEM: string,
            privateKeyPEM: string,
            getAccessToken: (id: string) => Promise<string>,
            refreshAccessToken: (id: string) => Promise<string>
        );
        
        ensureVehicle(id: string, vin: string): any;
        containsVehicle(id: string): boolean;
        getVehicle(id: string): any;
    }
} 