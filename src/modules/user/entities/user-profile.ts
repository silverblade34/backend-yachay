import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToOne,
    JoinColumn,
    ManyToMany,
    JoinTable,
} from 'typeorm';
import { User } from './user.entity';
import { Preference } from 'src/modules/preferences/entities/preference.entity';

@Entity('user_profiles')
export class UserProfile {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @OneToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @Column()
    gender: string;

    @Column({ type: 'date' })
    birthDate: string;

    @Column()
    academicLevelId: string;

    @Column({ nullable: true })
    careerId?: string;

    // Relación Many-to-Many con intereses/preferencias
    @ManyToMany(() => Preference, preference => preference.usersProfile)
    @JoinTable({
        name: 'user_preferences',
        joinColumn: { name: 'user_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'preference_id', referencedColumnName: 'id' }
    })
    preferences: Preference[];
}
