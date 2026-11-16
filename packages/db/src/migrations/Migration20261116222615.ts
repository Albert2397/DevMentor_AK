import { Migration } from "@mikro-orm/migrations";

export class Migration20261116222615 extends Migration {
  override name = "Migration20261116222615";

  override up(): void | Promise<void> {
    this.addSql(
      `create table "user_profile" ("id" uuid not null, "user_id" varchar(255) not null, "display_name" varchar(60) not null, "bio" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`,
    );
    this.addSql(
      `alter table "user_profile" add constraint "user_profile_user_id_unique" unique ("user_id");`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists "user_profile" cascade;`);
  }
}
