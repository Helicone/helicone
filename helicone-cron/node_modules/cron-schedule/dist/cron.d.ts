/**
 * An object with contains for each element of a date, which values are allowed.
 * Everything starting at 0, except for days.
 */
export interface ICronDefinition {
    readonly seconds: Set<number>;
    readonly minutes: Set<number>;
    readonly hours: Set<number>;
    readonly days: Set<number>;
    readonly months: Set<number>;
    readonly weekdays: Set<number>;
}
export declare class Cron {
    readonly seconds: ReadonlyArray<number>;
    readonly minutes: ReadonlyArray<number>;
    readonly hours: ReadonlyArray<number>;
    readonly days: ReadonlyArray<number>;
    readonly months: ReadonlyArray<number>;
    readonly weekdays: ReadonlyArray<number>;
    readonly reversed: {
        seconds: ReadonlyArray<number>;
        minutes: ReadonlyArray<number>;
        hours: ReadonlyArray<number>;
        days: ReadonlyArray<number>;
        months: ReadonlyArray<number>;
        weekdays: ReadonlyArray<number>;
    };
    constructor({ seconds, minutes, hours, days, months, weekdays, }: ICronDefinition);
    /**
     * Find the next or previous hour, starting from the given start hour that matches the hour constraint.
     * startHour itself might also be allowed.
     */
    private findAllowedHour;
    /**
     * Find the next or previous minute, starting from the given start minute that matches the minute constraint.
     * startMinute itself might also be allowed.
     */
    private findAllowedMinute;
    /**
     * Find the next or previous second, starting from the given start second that matches the second constraint.
     * startSecond itself IS NOT allowed.
     */
    private findAllowedSecond;
    /**
     * Find the next or previous time, starting from the given start time that matches the hour, minute
     * and second constraints. startTime itself might also be allowed.
     */
    private findAllowedTime;
    /**
     * Find the next or previous day in the given month, starting from the given startDay
     * that matches either the day or the weekday constraint. startDay itself might also be allowed.
     */
    private findAllowedDayInMonth;
    /** Gets the next date starting from the given start date or now. */
    getNextDate(startDate?: Date): Date;
    /** Gets the specified amount of future dates starting from the given start date or now. */
    getNextDates(amount: number, startDate?: Date): Date[];
    /**
     * Get an ES6 compatible iterator which iterates over the next dates starting from startDate or now.
     * The iterator runs until the optional endDate is reached or forever.
     */
    getNextDatesIterator(startDate?: Date, endDate?: Date): Generator<Date, undefined, undefined>;
    /** Gets the previous date starting from the given start date or now. */
    getPrevDate(startDate?: Date): Date;
    /** Gets the specified amount of previous dates starting from the given start date or now. */
    getPrevDates(amount: number, startDate?: Date): Date[];
    /**
     * Get an ES6 compatible iterator which iterates over the previous dates starting from startDate or now.
     * The iterator runs until the optional endDate is reached or forever.
     */
    getPrevDatesIterator(startDate?: Date, endDate?: Date): Generator<Date, undefined, undefined>;
    /** Returns true when there is a cron date at the given date. */
    matchDate(date: Date): boolean;
}
