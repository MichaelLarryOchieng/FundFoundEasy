//Page 113 Learn Java with Projects

import java.util.Scanner;

public class Mesozoic_Eden_If_statement {
    public static void main(String[] args){


       final String dino1 = "Plantsour";
       final String dino2 = "T-rex";
       final String dino3 = "R-rex";

        String food_type = " ";



        Scanner sc = new Scanner(System.in);
        System.out.println("Enter dinosaur name -->");
        String dinosaur = sc.next();



        if(  dinosaur.equalsIgnoreCase("T-rex") || dinosaur.equals("R-rex")){
            food_type = "carnivore";
            System.out.println("The"+" "+dinosaur+" "+" " + food_type);
        } else if (dinosaur.equals("Plantsour")) {
            food_type = "herbivore";
            System.out.println("The" + dinosaur + " " + " " + food_type);

        } else {
            System.out.println("The" + " " + dinosaur+ " "+ "is not in the park!");
        }

        switch (dinosaur){
            case dino1:
                System.out.println("These dinosaurs shouldn't eat too much " +
                        "greens to prevent diarrhia");
            case dino2:
                System.out.println("These dinosaurs should be kept in high fenced areas");
            case dino3:
                System.out.println("These dinosaurs are very active " +
                        "and need constant water supply to keep cool");

        }

       int employeeExperience = 5;


        if (employeeExperience > 3){
            System.out.println("Qualified for the job");
        } else {
            System.out.println("Not qualified for the job");
        }

        String DinoSize = "XL";

        String VeryLargeDino = "XL";
        String LargeDino = "L";
        String SmallDino = "S";
        String VerySmallDino = "XS";
        String MediumDino = "M";

        switch (DinoSize){

            case "XL" -> System.out.println("Needs one encloser per dino");
        }

//        boolean isCanivore = true;
//
//        boolean T_rex = isCanivore;
//
//        if(T_rex == isCanivore){
//            System.out.println("The T_rex is a carnivore" );
//        } else{
//            System.out.println("The dinosaur is either a herbivore or isnt found in the park");
//        }

    }
}
