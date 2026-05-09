package com.oms;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

@AnalyzeClasses(packagesOf = OmsApplication.class, importOptions = ImportOption.DoNotIncludeTests.class)
class ArchitectureTest {

    @ArchTest
    static final ArchRule domainShouldNotDependOnInfrastructure =
            noClasses().that().resideInAPackage("..domain..")
                    .should().dependOnClassesThat().resideInAPackage("..infrastructure..");

    @ArchTest
    static final ArchRule domainShouldNotUseJpaAnnotations =
            noClasses().that().resideInAPackage("..domain..")
                    .should().beAnnotatedWith("jakarta.persistence.Entity")
                    .orShould().beAnnotatedWith("jakarta.persistence.Table");

    @ArchTest
    static final ArchRule mappersShouldNotBeSpringBeans =
            noClasses().that().resideInAPackage("..mapper..")
                    .should().beAnnotatedWith(org.springframework.stereotype.Service.class)
                    .orShould().beAnnotatedWith(org.springframework.stereotype.Component.class);
}
