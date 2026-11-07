using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FitnessCompanion.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCascadeDeleteForeignKeys : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_WorkoutTemplates_UserId",
                table: "WorkoutTemplates",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkoutSessions_UserId",
                table: "WorkoutSessions",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_WaterEntries_UserId",
                table: "WaterEntries",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Targets_UserId",
                table: "Targets",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_SetEntries_UserId",
                table: "SetEntries",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_SavedMeals_UserId",
                table: "SavedMeals",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Measurements_UserId",
                table: "Measurements",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_FoodEntries_UserId",
                table: "FoodEntries",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_CustomFoods_UserId",
                table: "CustomFoods",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_CustomExercises_UserId",
                table: "CustomExercises",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_CheckIns_AspNetUsers_UserId",
                table: "CheckIns",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_CustomExercises_AspNetUsers_UserId",
                table: "CustomExercises",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_CustomFoods_AspNetUsers_UserId",
                table: "CustomFoods",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_FoodEntries_AspNetUsers_UserId",
                table: "FoodEntries",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_FoodOverrides_AspNetUsers_UserId",
                table: "FoodOverrides",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Measurements_AspNetUsers_UserId",
                table: "Measurements",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SavedMeals_AspNetUsers_UserId",
                table: "SavedMeals",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ScheduleEntries_AspNetUsers_UserId",
                table: "ScheduleEntries",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SetEntries_AspNetUsers_UserId",
                table: "SetEntries",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Targets_AspNetUsers_UserId",
                table: "Targets",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_UserProfiles_AspNetUsers_UserId",
                table: "UserProfiles",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_WaterEntries_AspNetUsers_UserId",
                table: "WaterEntries",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_WeightEntries_AspNetUsers_UserId",
                table: "WeightEntries",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_WorkoutSessions_AspNetUsers_UserId",
                table: "WorkoutSessions",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_WorkoutTemplates_AspNetUsers_UserId",
                table: "WorkoutTemplates",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CheckIns_AspNetUsers_UserId",
                table: "CheckIns");

            migrationBuilder.DropForeignKey(
                name: "FK_CustomExercises_AspNetUsers_UserId",
                table: "CustomExercises");

            migrationBuilder.DropForeignKey(
                name: "FK_CustomFoods_AspNetUsers_UserId",
                table: "CustomFoods");

            migrationBuilder.DropForeignKey(
                name: "FK_FoodEntries_AspNetUsers_UserId",
                table: "FoodEntries");

            migrationBuilder.DropForeignKey(
                name: "FK_FoodOverrides_AspNetUsers_UserId",
                table: "FoodOverrides");

            migrationBuilder.DropForeignKey(
                name: "FK_Measurements_AspNetUsers_UserId",
                table: "Measurements");

            migrationBuilder.DropForeignKey(
                name: "FK_SavedMeals_AspNetUsers_UserId",
                table: "SavedMeals");

            migrationBuilder.DropForeignKey(
                name: "FK_ScheduleEntries_AspNetUsers_UserId",
                table: "ScheduleEntries");

            migrationBuilder.DropForeignKey(
                name: "FK_SetEntries_AspNetUsers_UserId",
                table: "SetEntries");

            migrationBuilder.DropForeignKey(
                name: "FK_Targets_AspNetUsers_UserId",
                table: "Targets");

            migrationBuilder.DropForeignKey(
                name: "FK_UserProfiles_AspNetUsers_UserId",
                table: "UserProfiles");

            migrationBuilder.DropForeignKey(
                name: "FK_WaterEntries_AspNetUsers_UserId",
                table: "WaterEntries");

            migrationBuilder.DropForeignKey(
                name: "FK_WeightEntries_AspNetUsers_UserId",
                table: "WeightEntries");

            migrationBuilder.DropForeignKey(
                name: "FK_WorkoutSessions_AspNetUsers_UserId",
                table: "WorkoutSessions");

            migrationBuilder.DropForeignKey(
                name: "FK_WorkoutTemplates_AspNetUsers_UserId",
                table: "WorkoutTemplates");

            migrationBuilder.DropIndex(
                name: "IX_WorkoutTemplates_UserId",
                table: "WorkoutTemplates");

            migrationBuilder.DropIndex(
                name: "IX_WorkoutSessions_UserId",
                table: "WorkoutSessions");

            migrationBuilder.DropIndex(
                name: "IX_WaterEntries_UserId",
                table: "WaterEntries");

            migrationBuilder.DropIndex(
                name: "IX_Targets_UserId",
                table: "Targets");

            migrationBuilder.DropIndex(
                name: "IX_SetEntries_UserId",
                table: "SetEntries");

            migrationBuilder.DropIndex(
                name: "IX_SavedMeals_UserId",
                table: "SavedMeals");

            migrationBuilder.DropIndex(
                name: "IX_Measurements_UserId",
                table: "Measurements");

            migrationBuilder.DropIndex(
                name: "IX_FoodEntries_UserId",
                table: "FoodEntries");

            migrationBuilder.DropIndex(
                name: "IX_CustomFoods_UserId",
                table: "CustomFoods");

            migrationBuilder.DropIndex(
                name: "IX_CustomExercises_UserId",
                table: "CustomExercises");
        }
    }
}
