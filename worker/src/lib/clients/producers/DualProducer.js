export class DualWriteProducer {
    primary;
    secondary;
    constructor(primaryProducer, secondaryProducer) {
        this.primary = primaryProducer;
        this.secondary = secondaryProducer;
    }
    setLowerPriority() {
        if (!(this.secondary instanceof DualWriteProducer)) {
            this.secondary.setLowerPriority();
        }
        if (!(this.primary instanceof DualWriteProducer)) {
            this.primary.setLowerPriority();
        }
    }
    async sendMessage(msg) {
        // Send to primary and log any errors but don't fail
        try {
            console.log("Sending to primary queue");
            await this.primary.sendMessage(msg);
        }
        catch (error) {
            console.error(`Error sending to primary queue: ${error.message}`);
        }
        // Always return the result from the secondary
        console.log("Sending to secondary queue");
        return this.secondary.sendMessage(msg);
    }
}
